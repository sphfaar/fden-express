export default interface ArgohytosSchema {
    readonly header: Header[];
    readonly data: Datum[];
    readonly src: string;
    readonly count: number;
    readonly index: null;
    readonly hasDetails: boolean;
}

interface Datum {
    readonly id: string;
    readonly sysId: string;
    readonly sku: string;
    readonly materialNumber: string;
    readonly description: string;
    readonly dimension: string;
    readonly referenceNumber: string;
    readonly referenceName: string;
    readonly imagePath: string;
    readonly quantityUnit: string;
    readonly sortOrder: string;
}

interface Header {
    readonly id: string;
    readonly hidden?: boolean;
    readonly dictId?: string;
}
