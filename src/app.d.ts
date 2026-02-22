declare global {
    type ProductsFromSourcePromises = Map<
        SourceDescriptors,
        Promise<ProductsData>
    >;

    type ProductsFromSources = WeakMap<
        Promise<ProductsData>,
        {
            sourceDescriptors: SourceDescriptorsLocal;
            productsData: ProductsData;
        }
    >;

    interface GetProductsConfig {
        showPerfReqProxyToSource?: boolean;
        showPerfReqClientToProxy?: boolean;
    }

    interface SourceDescriptors {
        readonly sourceID: string;
        readonly name: string;
        readonly logo?: string;
        readonly banner?: string;
        readonly scrapingType:
            | "JSON API"
            | "HTML parser" /* | 'Automated browser'*/;
        readonly isLoggedIn: boolean | null; // null: not mandatory
    }

    interface SourceDescriptorsLocal extends Omit<
        SourceDescriptors,
        "isLoggedIn"
    > {
        isLoggedIn: boolean | null;
    }

    interface ProductsData {
        meta: MetaData;
        products: Product[];
    }

    interface MetaData {
        status: number;
        currentItemsDisplayed: number;
        totalItems: number | string | null; //if string the total item is unknown, eg. "120+ items"
        maxItemsPagination: number | null;
        page: number;
        pages?: number | null;
        performanceTimings?: {
            proxyToSource?: number | null;
            clientToProxy?: number | null;
        };
    }

    interface Product {
        manufacturer: string;
        manufacturer_code: string;
        source_reference_code: string;
        dimensions?: {
            externalDiameter?: number;
            internalDiameter?: number;
            height?: number;
        };
        specs?: {
            mediaType?: string;
            efficiency?: string; //filtration grade
            flowDirection?: string;
        };
        packaging?: {
            width: number;
            length: number;
            height: number;
        };
        detailsUrl?: string;
        description?: string;
        longDescription?: string;
        category?: string;
        thumbnails?: string[];
    }
}

export {};
