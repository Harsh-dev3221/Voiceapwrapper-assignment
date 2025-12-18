import { useQuery, gql } from '@apollo/client';

const GET_PROJECTS = gql`
  query GetProjects {
    allProjects {
      id
      name
      description
      status
    }
  }
`;

function ProjectList() {
    const { loading, error, data } = useQuery(GET_PROJECTS);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error : {error.message}</p>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Projects</h2>
            <div className="grid gap-4">
                {data.allProjects.map((project: any) => (
                    <div key={project.id} className="border p-4 rounded shadow">
                        <h3 className="font-bold">{project.name}</h3>
                        <p>{project.description}</p>
                        <div className="mt-2 text-sm text-gray-600">Status: {project.status}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProjectList;
