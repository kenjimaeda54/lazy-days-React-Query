import dayjs from 'dayjs';
import { useQuery } from 'react-query';

import type { Appointment, User } from '../../../../../shared/types';
import { axiosInstance, getJWTHeader } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import { useUser } from './useUser';

// for when we need a query function for useQuery
async function getUserAppointments(
  user: User | null,
): Promise<Appointment[] | null> {
  if (!user) return null;
  const { data } = await axiosInstance.get(`/user/${user.id}/appointments`, {
    headers: getJWTHeader(user),
  });
  return data.appointments;
}

export function useUserAppointments(): Appointment[] {
  const { user } = useUser();
  const { data: appointments = [] } = useQuery(
    // estou colando o queryKeys.appointments porque esta query
    // precisa ser invalidada, para refletir na tela de apontamento
    // ela depende do mutation
    // precisa a query que vai ser invalidada estar em primeiro
    // exemplo queryKeys.appointments
    [queryKeys.appointments, queryKeys.userAppointments, queryKeys.user],
    () => getUserAppointments(user),
    {
      // essa query so vai ser executada se existir um user
      // https://react-query.tanstack.com/guides/dependent-queries
      enabled: !!user,
    },
  );

  return appointments;
}
