export type ContractorType = "Work" | "Labour";

export interface Contractor {
    id: string;
    name: string;
    mobile: string;
    email: string;
    address: string;
    panCard: string;
    type: ContractorType;
    contactPerson?: string;
    gstNumber?: string;
    bankAccountHolderName?: string;
    bankName?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    bankBranch?: string;
    createdAt: string;
}

export interface Labour {
    id: string;
    contractorId: string;
    name: string;
    dob: string; // YYYY-MM-DD
    active: boolean;
    createdAt: string;
    aadharNumber?: string;
    bloodGroup?: string;
    contactNumber?: string;
    emergencyContactNumber?: string;
    contactAddress?: string;
    esiNumber?: string;
    uanNumber?: string;
}

export interface UtilizationHours {
    [labourId: string]: {
        [dateISO: string]: number;
    };
}
