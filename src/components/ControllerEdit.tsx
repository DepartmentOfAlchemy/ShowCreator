import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate, useParams } from 'react-router';
import useNotifications from '../hooks/useNotifications/useNotifications';
import {
  getOne as getController,
  updateOne as updateController,
  type Controller,
} from '../data/controllers';
import ControllerForm, { type ControllerFormValues } from './ControllerForm';
import PageContainer from './PageContainer';

export default function ControllerEdit() {
  const { controllerId } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [controller, setController] = React.useState<Controller | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const showData = await getController(Number(controllerId));
      setController(showData);
    } catch (showDataError) {
      setError(showDataError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [controllerId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = React.useCallback(
    async (formValues: ControllerFormValues) => {
      try {
        await updateController(Number(controllerId), formValues);
        notifications.show('Controller edited successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
        navigate('/controllers');
      } catch (editError) {
        notifications.show(
          `Failed to edit controller. Reason: ${(editError as Error).message}`,
          {
            severity: 'error',
            autoHideDuration: 3000,
          },
        );
      }
    },
    [controllerId, navigate, notifications],
  );

  const renderEdit = React.useMemo(() => {
    if (isLoading) {
      return (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            m: 1,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return (
        <Box sx={{ flexGrow: 1 }}>
          <Alert severity="error">{error.message}</Alert>
        </Box>
      );
    }

    if (!controller) {
      return null;
    }

    return (
      <ControllerForm
        initialValues={controller}
        onSubmit={handleSubmit}
        submitButtonLabel="Save"
        backButtonPath={`/controllers/${controllerId}`}
      />
    );
  }, [controller, controllerId, error, handleSubmit, isLoading]);

  return (
    <PageContainer
      title={`Edit Controller ${controllerId}`}
      breadcrumbs={[
        { title: 'Controllers', path: '/controllers' },
        { title: `Controller ${controllerId}`, path: `/controllers/${controllerId}` },
        { title: 'Edit' },
      ]}
    >
      <Box sx={{ display: 'flex', flex: 1 }}>{renderEdit}</Box>
    </PageContainer>
  );
}
