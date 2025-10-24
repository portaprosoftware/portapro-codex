import { Permissions } from '../../types';

export const DEFAULT_PERMISSIONS: Permissions = {
  tech_editable_fields: [], // Empty = all fields
  office_editable_fields: [], // Empty = all fields
  internal_only_fields: ['gps_coordinates', 'timestamp', 'internal_timestamp', 'tech_location', 'geo_location'],
  
  fee_permissions: {
    tech_can_see_suggestions: true,
    tech_can_add_remove_fees: true,
    tech_can_edit_amounts: false,
    office_can_edit_amounts: true,
    require_note_on_fee_removal: true,
  },
  
  stage_permissions: {
    lock_after_submit: true,
    office_can_edit_submitted: true,
    lock_after_customer_send: true,
    admin_can_reopen: true,
  },
  
  photo_permissions: {
    allow_internal_only_photos: true,
    office_can_hide_photos: true,
    log_photo_redactions: true,
  },
  
  delete_void_permissions: {
    admin_can_delete: true,
    office_can_void: true,
    require_deletion_reason: true,
  },
};
