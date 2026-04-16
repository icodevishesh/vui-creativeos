"use client";
import React, { useState, useRef } from "react";
import { FileUploader } from "react-drag-drop-files";

const fileTypes = ["JPG", "PNG", "GIF", "PDF", "ZIP", "MP4", "MKV", "PPTX", "DOCX", "XLSX"];

interface UploadProps {
	folderName?: string;
	onUploadComplete?: (fileData: { url: string; size: number; name: string; mimeType: string }) => void;
	disabled?: boolean;
}

export default function Upload({ folderName, onUploadComplete, disabled }: UploadProps) {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [speed, setSpeed] = useState(0); // bytes per second
	const [eta, setEta] = useState<number | null>(null);
	const [completed, setCompleted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const xhrRef = useRef<XMLHttpRequest | null>(null);

	const formatSize = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const formatSpeed = (bps: number) => {
		return formatSize(bps) + "/s";
	};

	const formatEta = (seconds: number) => {
		if (seconds === Infinity || isNaN(seconds)) return "--";
		if (seconds < 60) return `${Math.round(seconds)}s`;
		return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
	};

	const handleUpload = (selected: File | File[]) => {
		const selectedFile = Array.isArray(selected) ? selected[0] : selected;
		if (!selectedFile) return;

		setFile(selectedFile);
		setUploading(true);
		setProgress(0);
		setCompleted(false);
		setError(null);

		const formData = new FormData();
		formData.append("file", selectedFile);
		if (folderName) {
			formData.append("folderName", folderName);
		}

		const xhr = new XMLHttpRequest();
		xhrRef.current = xhr;

		let startTime = Date.now();

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				const percentComplete = (event.loaded / event.total) * 100;
				setProgress(percentComplete);

				// Calculate speed
				const now = Date.now();
				const duration = (now - startTime) / 1000; // seconds
				if (duration > 0) {
					const currentSpeed = event.loaded / duration;
					setSpeed(currentSpeed);

					// Calculate ETA
					const remainingBytes = event.total - event.loaded;
					const remainingTime = remainingBytes / currentSpeed;
					setEta(remainingTime);
				}
			}
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				setCompleted(true);
				setUploading(false);
				setEta(null);

				if (onUploadComplete) {
					try {
						const response = JSON.parse(xhr.responseText);
						onUploadComplete({
							url: response.url,
							size: response.size,
							name: response.name,
							mimeType: response.mimeType || selectedFile.type
						});
					} catch (e) {
						console.error("Failed to parse upload response", e);
					}
				}
			} else {
				setError("Upload failed. Please try again.");
				setUploading(false);
			}
		};
		xhr.onerror = () => {
			setError("Network error occurred.");
			setUploading(false);
		};

		xhr.open("POST", "/api/file/upload");
		xhr.send(formData);
	};

	return (
		<div className="w-full flex flex-col items-center justify-center">
			<div className="z-10 w-full font-sans text-sm fade-in">
				<div className="p-4 rounded-3xl space-y-6">
					<div className={`relative group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
						<FileUploader
							handleChange={handleUpload}
							name="file"
							types={fileTypes}
							disabled={disabled}
							children={
								<div className={`border-2 border-dashed border-slate-600 rounded-lg p-4 text-center transition-all duration-300 ${disabled ? '' : 'cursor-pointer hover:border-blue-500 group-hover:scale-[1.01]'}`}>
									{/* <div className="text-6xl mb-4">🚀</div> */}
									<p className="text-sm font-medium text-black">
										{file ? file.name : (disabled ? "Fill out name before uploading" : "Drag & drop or click to upload")}
									</p>
									<p className="text-sm text-slate-500 mt-2">
										Supported: JPG, PNG, GIF, PDF, ZIP (Max 1GB)
									</p>
								</div>
							}
						/>
					</div>

					{(uploading || completed || error) && (
						<div className="space-y-4 fade-in">
							<div className="flex justify-between items-end">
								<div>
									<h3 className="text-lg font-semibold text-slate-200">
										{completed
											? "✨ Upload Complete!"
											: uploading
												? "⚡ Uploading..."
												: "❌ Error"}
									</h3>
									{file && (
										<p className="text-xs text-slate-400">
											{file.name} • {formatSize(file.size)}
										</p>
									)}
								</div>
								{uploading && (
									<div className="text-right">
										<p className="text-sm font-bold text-amber-400">
											{Math.round(progress)}%
										</p>
									</div>
								)}
							</div>

							<div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
								<div
									className={`h-full transition-all duration-300 ease-out ${completed ? "bg-emerald-500" : "progress-shimmer"}`}
									style={{ width: `${progress}%` }}
								/>
							</div>

							{uploading && (
								<div className="grid grid-cols-2 gap-4 text-xs font-medium uppercase tracking-wider text-slate-500">
									<div className="glass p-3 rounded-lg flex flex-col items-center">
										<span>Speed</span>
										<span className="text-slate-200 mt-1">
											{formatSpeed(speed)}
										</span>
									</div>
									<div className="glass p-3 rounded-lg flex flex-col items-center">
										<span>Time Left</span>
										<span className="text-slate-200 mt-1">
											{formatEta(eta || 0)}
										</span>
									</div>
								</div>
							)}

							{error && (
								<p className="text-red-400 text-sm text-center">{error}</p>
							)}

							{completed && (
								<button
									onClick={() => {
										setFile(null);
										setCompleted(false);
										setProgress(0);
									}}
									className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 font-bold hover:opacity-90 transition-opacity"
								>
									Upload Another
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
