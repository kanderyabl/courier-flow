export type CreateOrderValidationMessages = {
  pickupAddressRequired: string;
  pickupAddressTooLong: string;

  deliveryAddressRequired: string;
  deliveryAddressTooLong: string;

  recipientNameRequired: string;
  recipientNameTooLong: string;

  recipientPhoneRequired: string;
  recipientPhoneInvalid: string;

  commentTooLong: string;
};
