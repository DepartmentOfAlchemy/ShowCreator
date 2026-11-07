import * as React from 'react';
import { useNavigate } from 'react-router';
import useNotifications from '../hooks/useNotifications/useNotifications';
import { createOne as createController } from '../data/controllers';
import ControllerForm, { type ControllerFormValues } from './ControllerForm';
import PageContainer from './PageContainer';

const INITIAL_FORM_VALUES: ControllerFormValues = {
  name: '',
  description: '',
  manufacturer: '',
  model: '',
  version: '',
  outputs: [],
  inputs: [],
};

export default function ControllerCreate() {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const handleSubmit = React.useCallback(
    async (formValues: ControllerFormValues) => {
      try {
        await createController(formValues);
        notifications.show('Controller created successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
        navigate('/controllers');
      } catch (createError) {
        notifications.show(
          `Failed to create controller. Reason: ${(createError as Error).message}`,
          {
            severity: 'error',
            autoHideDuration: 3000,
          },
        );
      }
    },
    [navigate, notifications],
  );

  return (
    <PageContainer
      title="New Controller"
      breadcrumbs={[{ title: 'Controllers', path: '/controllers' }, { title: 'New' }]}
    >
      <ControllerForm
        initialValues={INITIAL_FORM_VALUES}
        onSubmit={handleSubmit}
        submitButtonLabel="Create"
        backButtonPath="/controllers"
      />
    </PageContainer>
  );
}
