https://creative-flow-hub-51.lovable.app/clients/acme-corp

overview:
    - add edit button in each card, onboarding notes, requirement notes and compititors

team:
    - add assign team members button
    - a form will open to add active team mebers + there roles
    - add more members repeat the above 
    - check more than one member does not have the same role
    - add a button to remove team members
    - create api for these actions, related only specific client's team

scope of work:
    - show the scope of work list
    - add button to add any other scope of work
    - create api for these actions, related only specific client's scope of work

documents:
    - Show all the list of documents specific to the clients
    - add button to upload any other document
    - create api for these actions, related only specific client's documents

meeting logs:
    - Show all the list of meeting logs specific to the clients
    - add button to add any other meeting log: open a form to add title, description, createdAt
    - create api for these actions, related only specific client's meeting logs

Make sure to follow the UI of the image provided


You are a senior frontend engineer specializing in React and performance optimization.

Task:
Build a production-ready.

Requirements:
- Tech: React + TypeScript
- Styling: Tailwind CSS
- Must be reusable and modular
- Optimize for performance and accessibility

Include:
1. Component code
2. Props interface
3. Explanation of architecture decisions
4. Performance considerations
5. use tanstack for client side api request
6. useMemo or useCallback for perfomance
7. add react skeletan loading for each component and try to maintain their own space including the ui + api + data 

read my database schema: schema.prisma
 
create route as well as accoring to the 
page requirement and try to maintain database consistency

Avoid unnecessary re-renders and ensure clean separation of concerns.