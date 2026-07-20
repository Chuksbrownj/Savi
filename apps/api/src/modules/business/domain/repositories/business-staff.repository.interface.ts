import { StaffProfile, DispatchRiderProfile } from '@prisma/client';

export interface IBusinessStaffRepository {
  createStaffProfile(
    data: Omit<StaffProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StaffProfile>;
  findStaff(businessId: string): Promise<StaffProfile[]>;
  updateStaff(
    businessId: string,
    id: string,
    data: Partial<StaffProfile>,
  ): Promise<StaffProfile>;
  deleteStaff(businessId: string, id: string): Promise<void>;

  createRiderProfile(
    data: Omit<
      DispatchRiderProfile,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'availability'
      | 'currentLat'
      | 'currentLng'
      | 'rating'
      | 'totalDeliveries'
      | 'isActive'
    >,
  ): Promise<DispatchRiderProfile>;
  findRiders(businessId: string): Promise<DispatchRiderProfile[]>;
  updateRider(
    businessId: string,
    id: string,
    data: Partial<DispatchRiderProfile>,
  ): Promise<DispatchRiderProfile>;
}
