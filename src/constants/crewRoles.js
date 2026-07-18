export const CREW_ROLES = {
    PRODUCER: 'producer',
    DIRECTOR: 'director',
    DOP: 'dop',
    CAMERA_OPERATOR: 'camera_operator',
    EDITOR: 'editor',
    DESIGNER: 'designer',
    SOUND: 'sound',
    LIGHTING: 'lighting',
    LIVESTREAM_OPERATOR: 'livestream_operator',
    EVENT_COORDINATOR: 'event_coordinator',
    ASSISTANT: 'assistant',
};

export const CREW_ROLE_LABELS = {
    [CREW_ROLES.PRODUCER]: 'Producer',
    [CREW_ROLES.DIRECTOR]: 'Director',
    [CREW_ROLES.DOP]: 'DOP',
    [CREW_ROLES.CAMERA_OPERATOR]: 'Camera Operator',
    [CREW_ROLES.EDITOR]: 'Editor',
    [CREW_ROLES.DESIGNER]: 'Designer',
    [CREW_ROLES.SOUND]: 'Sound',
    [CREW_ROLES.LIGHTING]: 'Lighting',
    [CREW_ROLES.LIVESTREAM_OPERATOR]: 'Livestream Operator',
    [CREW_ROLES.EVENT_COORDINATOR]: 'Event Coordinator',
    [CREW_ROLES.ASSISTANT]: 'Assistant',
};

export const CREW_ROLE_OPTIONS = Object.values(CREW_ROLES);
