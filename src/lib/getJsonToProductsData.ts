import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { GetProductsConfig } from "./types.js";

interface ParsingFunctions<T> {
    rowsIterator: (resData: T) => Product[];
    nPages?: ((resData: T) => number) | null;
    pagination?: number | ((resData: T) => number | null);
    totalItems?: (resData: T) => number | string | null;
}
export async function getJsonToProducts<T>(
    sourceName: string,
    axiosReqConfig: AxiosRequestConfig,
    parsingFunctions: ParsingFunctions<T>,
    config?: GetProductsConfig,
    page?: number,
): Promise<ProductsData> {
    try {
        const reqStart = config?.showPerfReqProxyToSource ? Date.now() : null;
        const response = await axios.request(axiosReqConfig);
        if (response.status >= 400) {
            return {
                meta: {
                    status: response.status,
                    currentItemsDisplayed: 0,
                    totalItems: null,
                    page: 0,
                    maxItemsPagination: null,
                },
                products: [],
            };
        }
        const responseData = response.data;
        const reqEnd = config?.showPerfReqProxyToSource ? Date.now() : null;
        const products: Product[] = parsingFunctions.rowsIterator(responseData);
        return {
            meta: {
                status: response.status,
                currentItemsDisplayed: products.length,
                totalItems: parsingFunctions.totalItems
                    ? parsingFunctions.totalItems(responseData)
                    : null,
                page: page ?? 1,
                pages: parsingFunctions.nPages
                    ? parsingFunctions.nPages(responseData)
                    : undefined,
                maxItemsPagination:
                    typeof parsingFunctions.pagination === "number"
                        ? parsingFunctions.pagination
                        : parsingFunctions.pagination
                          ? parsingFunctions.pagination(responseData)
                          : null,
                performanceTimings: {
                    proxyToSource:
                        reqEnd && reqStart ? reqEnd - reqStart : null,
                },
            },
            products: products,
        };
    } catch (err) {
        console.error(`${sourceName} ${err}`);
    }
}
