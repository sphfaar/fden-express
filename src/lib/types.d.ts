interface GetProductsConfig {
    showPerfReqProxyToSource?: boolean;
    showPerfReqClientToProxy?: boolean;
}
export type GetProducts = (
    code: string,
    maxItems: number,
    config?: GetProductsConfig,
    page?: number,
    opts?: {
        sessionToken?: string;
        retries?: number;
    },
) => Promise<ProductsData>;

export type GetNextProducts = (
    code: string,
    maxItems: number,
    config?: GetProductsConfig,
    page: number,
    opts?: {
        sessionToken?: string;
        retries?: number;
    },
) => Promise<ProductsData> | null;
