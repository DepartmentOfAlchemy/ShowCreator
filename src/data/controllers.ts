import type { GridFilterModel, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

type OutputType = 'DMX' | 'MIDI' | 'Analog' | 'Digital';
type InputType = 'Digital';

export interface Controller {
    id: number;
    name: string;
    description: string;
    manufacturer: string;
    model: string;
    version: string;
    outputs: OutputType[];
    inputs: InputType[];
}

const INITIAL_CONTROLLERS_STORE: Controller[] = [
    {
        id: 1,
        name: 'Codex 43',
        description: 'Controller with 4 SSO outputs and 3 digitally isolated inputs',
        manufacturer: 'Department of Alchemy',
        model: 'Codex 43',
        version: 'B',
        outputs: ['Analog', 'Analog', 'Analog', 'Analog'],
        inputs: ['Digital', 'Digital', 'Digital'],
    }
];

export function getControllersStore(): Controller[] {
  const stringifiedControllers = localStorage.getItem('controllers-store');
  return stringifiedControllers ? JSON.parse(stringifiedControllers) : INITIAL_CONTROLLERS_STORE;
}

export function setControllersStore(controllers: Controller[]) {
  return localStorage.setItem('controllers-store', JSON.stringify(controllers));
}

export async function getMany({
  paginationModel,
  filterModel,
  sortModel,
}: {
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  filterModel: GridFilterModel;
}): Promise<{ items: Controller[]; itemCount: number }> {
  const controllersStore = getControllersStore();

  let filteredControllers = [...controllersStore];

  // Apply filters (example only)
  if (filterModel?.items?.length) {
    filterModel.items.forEach(({ field, value, operator }) => {
      if (!field || value == null) {
        return;
      }

      filteredControllers = filteredControllers.filter((controller) => {
        const controllerValue = controller[field as keyof Controller];

        switch (operator) {
          case 'contains':
            return String(controllerValue).toLowerCase().includes(String(value).toLowerCase());
          case 'equals':
            return controllerValue === value;
          case 'startsWith':
            return String(controllerValue).toLowerCase().startsWith(String(value).toLowerCase());
          case 'endsWith':
            return String(controllerValue).toLowerCase().endsWith(String(value).toLowerCase());
          case '>':
            return controllerValue > value;
          case '<':
            return controllerValue < value;
          default:
            return true;
        }
      });
    });
  }

  // Apply sorting
  if (sortModel?.length) {
    filteredControllers.sort((a, b) => {
      for (const { field, sort } of sortModel) {
        if (a[field as keyof Controller] < b[field as keyof Controller]) {
          return sort === 'asc' ? -1 : 1;
        }
        if (a[field as keyof Controller] > b[field as keyof Controller]) {
          return sort === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }

  // Apply pagination
  const start = paginationModel.page * paginationModel.pageSize;
  const end = start + paginationModel.pageSize;
  const paginatedControllers = filteredControllers.slice(start, end);

  return {
    items: paginatedControllers,
    itemCount: filteredControllers.length,
  };
}

export async function getOne(controllerId: number) {
  const controllersStore = getControllersStore();

  const controllerToShow = controllersStore.find((controller) => controller.id === controllerId);

  if (!controllerToShow) {
    throw new Error('Controller not found');
  }
  return controllerToShow;
}

export async function createOne(data: Omit<Controller, 'id'>) {
  const controllersStore = getControllersStore();

  const newController = {
    id: controllersStore.reduce((max, controller) => Math.max(max, controller.id), 0) + 1,
    ...data,
  };

  setControllersStore([...controllersStore, newController]);

  return newController;
}

export async function updateOne(controllerId: number, data: Partial<Omit<Controller, 'id'>>) {
  const controllersStore = getControllersStore();

  let updatedController: Controller | null = null;

  setControllersStore(
    controllersStore.map((controller) => {
      if (controller.id === controllerId) {
        updatedController = { ...controller, ...data };
        return updatedController;
      }
      return controller;
    }),
  );

  if (!updatedController) {
    throw new Error('Controller not found');
  }
  return updatedController;
}

export async function deleteOne(controllerId: number) {
  const controllersStore = getControllersStore();

  setControllersStore(controllersStore.filter((controller) => controller.id !== controllerId));
}

// Validation follows the [Standard Schema](https://standardschema.dev/).

type ValidationResult = { issues: { message: string; path: (keyof Controller)[] }[] };

export function validate(controller: Partial<Controller>): ValidationResult {
  let issues: ValidationResult['issues'] = [];

  if (!controller.name) {
    issues = [...issues, { message: 'Name is required', path: ['name'] }];
  }

  return { issues };
}