
export const sendSuccessResponse = (
    res,
    {
        statusCode = 200,
        message = "Success",
        data = null,
    }
) => {

    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const sendPaginatedResponse = (res, { data, total, page, limit }) => {
    return res.status(200).json({
        success: true,
        data,
        total,
        page,
        limit,
    });
};