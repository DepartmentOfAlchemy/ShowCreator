import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router';
import { validate as validateController, type Controller } from '../data/controllers';

export type ControllerFormValues = Omit<Controller, 'id'>;
type ControllerFormErrors = Partial<Record<keyof ControllerFormValues, string>>;
type TextFieldName = 'name' | 'description' | 'manufacturer' | 'model' | 'version';

const OUTPUT_TYPES: Controller['outputs'][number][] = [
  'DMX',
  'MIDI',
  'Analog',
  'Digital',
];
const INPUT_TYPES: Controller['inputs'][number][] = ['Digital'];

export interface ControllerFormProps {
  initialValues: ControllerFormValues;
  onSubmit: (formValues: ControllerFormValues) => Promise<void>;
  submitButtonLabel: string;
  backButtonPath: string;
}

function isAllowedType<T extends string>(
  value: string,
  allowedTypes: T[],
): value is T {
  return allowedTypes.some((type) => type === value);
}

function parseTypes<T extends string>(
  text: string,
  allowedTypes: T[],
): { values: T[]; error?: string } {
  const entries = text
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.some((entry) => !isAllowedType(entry, allowedTypes))) {
    return {
      values: [],
      error: `Use only ${allowedTypes.join(', ')}.`,
    };
  }

  return {
    values: entries.filter((entry): entry is T => isAllowedType(entry, allowedTypes)),
  };
}

export default function ControllerForm({
  initialValues,
  onSubmit,
  submitButtonLabel,
  backButtonPath,
}: ControllerFormProps) {
  const navigate = useNavigate();
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<ControllerFormErrors>({});
  const [outputsText, setOutputsText] = React.useState(initialValues.outputs.join(', '));
  const [inputsText, setInputsText] = React.useState(initialValues.inputs.join(', '));
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleTextChange = React.useCallback(
    (field: TextFieldName, value: string) => {
      setValues((previousValues) => ({ ...previousValues, [field]: value }));
      setErrors((previousErrors) => ({ ...previousErrors, [field]: undefined }));
    },
    [],
  );

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const parsedOutputs = parseTypes(outputsText, OUTPUT_TYPES);
      const parsedInputs = parseTypes(inputsText, INPUT_TYPES);
      const formValues: ControllerFormValues = {
        ...values,
        outputs: parsedOutputs.values,
        inputs: parsedInputs.values,
      };
      const { issues } = validateController(formValues);
      const nextErrors: ControllerFormErrors = {};

      for (const issue of issues) {
        const field = issue.path[0];
        if (field !== 'id') {
          nextErrors[field] = issue.message;
        }
      }
      if (parsedOutputs.error) {
        nextErrors.outputs = parsedOutputs.error;
      }
      if (parsedInputs.error) {
        nextErrors.inputs = parsedInputs.error;
      }
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      setErrors({});
      setIsSubmitting(true);
      try {
        await onSubmit(formValues);
      } finally {
        setIsSubmitting(false);
      }
    },
    [inputsText, onSubmit, outputsText, values],
  );

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      autoComplete="off"
      sx={{ width: '100%' }}
    >
      <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            value={values.name}
            onChange={(event) => handleTextChange('name', event.target.value)}
            label="Name"
            error={!!errors.name}
            helperText={errors.name ?? ' '}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            value={values.description}
            onChange={(event) => handleTextChange('description', event.target.value)}
            label="Description"
            error={!!errors.description}
            helperText={errors.description ?? ' '}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            value={values.manufacturer}
            onChange={(event) => handleTextChange('manufacturer', event.target.value)}
            label="Manufacturer"
            error={!!errors.manufacturer}
            helperText={errors.manufacturer ?? ' '}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            value={values.model}
            onChange={(event) => handleTextChange('model', event.target.value)}
            label="Model"
            error={!!errors.model}
            helperText={errors.model ?? ' '}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            value={values.version}
            onChange={(event) => handleTextChange('version', event.target.value)}
            label="Version"
            error={!!errors.version}
            helperText={errors.version ?? ' '}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            value={outputsText}
            onChange={(event) => {
              setOutputsText(event.target.value);
              setErrors((previousErrors) => ({
                ...previousErrors,
                outputs: undefined,
              }));
            }}
            label="Outputs"
            error={!!errors.outputs}
            helperText={errors.outputs ?? 'Comma-separated: DMX, MIDI, Analog, Digital'}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            value={inputsText}
            onChange={(event) => {
              setInputsText(event.target.value);
              setErrors((previousErrors) => ({
                ...previousErrors,
                inputs: undefined,
              }));
            }}
            label="Inputs"
            error={!!errors.inputs}
            helperText={errors.inputs ?? 'Comma-separated: Digital'}
            fullWidth
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(backButtonPath)}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
        >
          {submitButtonLabel}
        </Button>
      </Stack>
    </Box>
  );
}
