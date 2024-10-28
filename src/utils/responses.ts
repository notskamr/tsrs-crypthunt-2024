
export function JSONResponse(data: any, init?: ResponseInit | undefined) {
    const { headers, ...rest } = init ?? {};
    return new Response(JSON.stringify(data), {
        headers: {
            "content-type": "application/json",
            ...headers
        },
        ...rest
    });
}

