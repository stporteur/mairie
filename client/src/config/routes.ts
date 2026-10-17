/** Base URL of the parameters screens; the registry path is this without the leading slash. */
export const PARAMETERS_PATH = '/parameters';

export const parameterPath = (id: number): string => `${PARAMETERS_PATH}/${id}`;
export const NEW_PARAMETER_PATH = `${PARAMETERS_PATH}/new`;
