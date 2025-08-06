// create-workflow.dto.ts
export interface CreateWorkflowDto {
  name: string;
  json: {
    $type: string;
    id: string;
    targetNamespace: string;
    rootElements: {
      $type: string;
      id: string;
      isExecutable: boolean;
      flowElements: { $type: string; id: string }[];
    }[];
  };
}