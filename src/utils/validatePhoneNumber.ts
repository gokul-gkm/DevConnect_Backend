import { parsePhoneNumberFromString } from "libphonenumber-js";

export const validatePhoneNumber = (contact: string) => {
  const phone = parsePhoneNumberFromString(contact);

  if (!phone || !phone.isValid()) {
    throw new Error("Invalid phone number");
  }

  return phone.format("E.164");
};
