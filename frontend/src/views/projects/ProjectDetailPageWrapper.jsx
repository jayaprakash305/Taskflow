import { useParams } from "react-router-dom";
import { ProjectProvider } from "../../context/ProjectContext";
import ProjectDetailPage from "./ProjectDetailPage";

export default function ProjectDetailPageWrapper() {
  const { id } = useParams();

  return (
    <ProjectProvider projectId={id}>
      <ProjectDetailPage />
    </ProjectProvider>
  );
}
