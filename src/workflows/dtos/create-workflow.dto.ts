export interface CreateWorkflowDto {
  name: string;
  json: {
    $type: string;
    id?: string;
    targetNamespace?: string;
    rootElements: {
      $type: string;
      id?: string;
      isExecutable?: boolean;
      flowElements?: Array<{
        $type: string;
        id: string;
        name?: string;
        sourceRef?: string;
        targetRef?: string;
      }>;
    }[];
  };
}