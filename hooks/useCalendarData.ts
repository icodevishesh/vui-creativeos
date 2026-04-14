import { useState, useEffect } from 'react';
import { TaskStatus } from '@prisma/client';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  startDate: Date | null;
  clientId: string;
  projectId: string;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  project: {
    name: string;
  };
  client: {
    companyName: string;
  };
}

interface Client {
  id: string;
  companyName: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
}

export const useCalendarData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tasks
        const tasksResponse = await fetch('/api/tasks');
        if (!tasksResponse.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const tasksData = await tasksResponse.json();
        
        // Fetch clients
        const clientsResponse = await fetch('/api/clients');
        if (!clientsResponse.ok) {
          throw new Error('Failed to fetch clients');
        }
        const clientsData = await clientsResponse.json();
        
        // Fetch projects
        const projectsResponse = await fetch('/api/projects');
        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch projects');
        }
        const projectsData = await projectsResponse.json();

        setTasks(tasksData);
        setClients(clientsData);
        setProjects(projectsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    tasks,
    clients,
    projects,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Refetch logic would go here
    }
  };
};
