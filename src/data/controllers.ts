import { invoke } from '@tauri-apps/api/core';
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

async function getControllers(): Promise<Controller[]> {
  const legacyControllersJson = localStorage.getItem('controllers-store');
  const controllers = await invoke<Controller[]>('get_controllers', {
    legacyControllersJson,
  });

  if (legacyControllersJson !== null) {
    localStorage.removeItem('controllers-store');
  }

  return controllers;
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
  const controllersStore = await getControllers();

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
  await getControllers();
  return invoke<Controller>('get_controller', { controllerId });
}

export async function createOne(data: Omit<Controller, 'id'>) {
  await getControllers();
  return invoke<Controller>('create_controller', { data });
}

export async function updateOne(controllerId: number, data: Partial<Omit<Controller, 'id'>>) {
  await getControllers();
  return invoke<Controller>('update_controller', { controllerId, data });
}

export async function deleteOne(controllerId: number) {
  await getControllers();
  await invoke<void>('delete_controller', { controllerId });
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