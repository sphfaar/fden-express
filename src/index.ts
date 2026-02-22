import express from "express";
import axios from "axios";
import cors from "cors";
import type { Request, Response } from "express";
import { getJsonToProducts } from "./lib/getJsonToProductsData.js";
import ArgohytosSchema from "./lib/sourcesResponeSchemas/ArgohytosSchema.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: "*" })); // NOTE: change to your SvelteKit domain in production

app.post("/api/fleetguard", async (req: Request, res: Response) => {
    const { code, maxItems = 10 }: { code: string; maxItems?: number } =
        req.body;

    if (!code || typeof code !== "string" || code.length < 3) {
        return res.status(400).json({ error: "Invalid code" });
    }

    // Base headers that mimic real browser (prevents redirect loop)
    const baseHeaders = {
        "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://www.fleetguard.com",
        Referer: "https://www.fleetguard.com/results",
        Host: "www.fleetguard.com",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-GPC": "1",
    };

    try {
        // FIX: Alphabetically sorted query params – fleetguard enforces this
        const params = {
            asGuest: "true",
            htmlEncode: "false",
            language: "en-US",
        };

        // === 1. First request ===
        const data1 = {
            namespace: "",
            classname: "@udd/01pPL000001p0qx",
            method: "fetchProductsFromParts",
            isContinuation: false,
            params: { searchTerm: code },
            cacheable: false,
        };

        const config1 = {
            method: "POST" as const,
            url: "https://www.fleetguard.com/webruntime/api/apex/execute",
            params,
            headers: {
                ...baseHeaders,
                "Content-Type": "application/json; charset=utf-8",
                cookie: "CookieConsentPolicy=0%3A1; LSKey-c%24CookieConsentPolicy=0%3A1",
            },
            data: data1,
            maxRedirects: 5,
        };

        const res1 = await axios.request(config1);
        const parsed1 = JSON.parse(res1.data.returnValue);

        const ids = parsed1.products?.map((p: any) => p.Id) || [];

        // === 2. Second request ===
        const config2 = {
            method: "POST" as const,
            url: "https://www.fleetguard.com/webruntime/api/apex/execute",
            params,
            headers: {
                ...baseHeaders,
                "Content-Type": "application/json",
            },
            data: {
                namespace: "",
                classname: "@udd/01pPL000001p0qx",
                method: "getProductDetailsFromParts",
                isContinuation: false,
                params: {
                    ids,
                    searchTerm: code,
                    pageNumber: 1,
                    pageSize: Math.min(maxItems, 10).toString(),
                },
                cacheable: false,
            },
            maxRedirects: 5,
        };

        const res2 = await axios.request(config2);
        const data = res2.data;

        // NOTE: Exact same shape your SvelteKit expects
        const products: any[] = [];
        if (data?.returnValue?.items) {
            for (const row of data.returnValue.items) {
                products.push({
                    manufacturer:
                        row.productDetailsWrapper?.eqManufacturer ??
                        "no manufacturer 🗿",
                    manufacturer_code:
                        row.productDetailsWrapper?.crossReferenceName ??
                        "no manuf. code 🧐",
                    source_reference_code:
                        row.productDetailsWrapper?.productName ??
                        "no cross code 🧐",
                    thumbnails: [row.imageUrl],
                });
            }
        }

        return res.json({
            meta: {
                status: res2.status,
                currentItemsDisplayed: products.length,
                totalItems: data?.returnValue?.totalRecords ?? null,
                page: 1,
                maxItemsPagination: null,
                performanceTimings: { proxyToSource: null },
            },
            products,
        });
    } catch (err: any) {
        console.error("Fleetguard Proxy Error:", {
            status: err?.response?.status,
            message: err.message,
            data: err?.response?.data,
        });

        return res.status(500).json({
            meta: {
                status: 500,
                currentItemsDisplayed: 0,
                totalItems: 0,
                page: 0,
                maxItemsPagination: null,
            },
            products: [],
        });
    }
});

app.post("/api/argohytos", async (req: Request, res: Response) => {
    const { code, page }: { code: string; page: number } = req.body;

    if (!code || typeof code !== "string" || code.length < 3) {
        return res.status(400).json({ error: "Invalid code" });
    }
    const axiosReqConfig = {
        method: "POST",
        url: "https://portal.argo-hytos.com/core-app/api/elastic-search/oem-spare-parts",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
            Accept: "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.5",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Content-Type": "application/json",
            Host: "portal.argo-hytos.com",
            Origin: "https://portal.argo-hytos.com",
            Pragma: "no-cache",
            Referer: "https://portal.argo-hytos.com/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Sec-GPC": "1",
            TE: "trailers",
        },
        data: {
            term: code,
            filters: [],
            language: "en",
            limit: 12,
            offset: (page - 1) * 12,
        },
    };
    try {
        return getJsonToProducts<ArgohytosSchema>(
            "argohytos",
            axiosReqConfig,
            {
                rowsIterator: (resData) => {
                    const products: Product[] = [];

                    for (let i = 0; i < resData.data.length; i++) {
                        const row = resData.data[i];
                        products.push({
                            manufacturer: row.referenceName,
                            manufacturer_code: row.referenceNumber,
                            source_reference_code: row.materialNumber,
                            detailsUrl: `https://portal.argo-hytos.com/#/catalog/ai_argo_hytos_products/search/ai_filter_elements/product-details/${row.id}`,
                            description: row.description,
                            thumbnails: [row.imagePath],
                            specs: row.dimension
                                ? {
                                      efficiency:
                                          row.dimension.match(/\d+/)?.[0] ??
                                          undefined,
                                  }
                                : undefined,
                        });
                    }
                    return products;
                },
                nPages: (resData) => Math.ceil(resData.count / 12),
            },
            undefined,
            page,
        );
    } catch (err) {
        console.error("argohytos error", err);
        return {
            meta: {
                status: 500,
                currentItemsDisplayed: 0,
                totalItems: null,
                maxItemsPagination: null,
                page: 0,
            },
            products: [],
        };
    }
});

export default app;
