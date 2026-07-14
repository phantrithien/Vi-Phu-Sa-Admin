export const EMPLOYEE_STATUSES = {
    ACTIVE: 'active',
    ON_LEAVE: 'on_leave',
    INACTIVE: 'inactive',
};

export const EMPLOYEE_STATUS_LABELS = {
    [EMPLOYEE_STATUSES.ACTIVE]: 'Đang làm việc',
    [EMPLOYEE_STATUSES.ON_LEAVE]: 'Nghỉ phép',
    [EMPLOYEE_STATUSES.INACTIVE]: 'Nghỉ việc',
};

export const TASK_STATUSES = {
    PROPOSED: 'proposed',
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done',
};

export const TASK_STATUS_LABELS = {
    [TASK_STATUSES.PROPOSED]: 'Đề xuất công việc',
    [TASK_STATUSES.TODO]: 'Cần làm',
    [TASK_STATUSES.IN_PROGRESS]: 'Đang xử lý',
    [TASK_STATUSES.REVIEW]: 'Chờ duyệt',
    [TASK_STATUSES.DONE]: 'Hoàn thành',
};
