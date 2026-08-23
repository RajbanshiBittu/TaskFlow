const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const parsePagination = ({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
	const parsedPage = Number(page);
	const parsedLimit = Number(limit);

	if (!Number.isInteger(parsedPage) || parsedPage < 1) {
		throw new Error("page must be a positive integer");
	}
	if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
		throw new Error(`limit must be an integer between 1 and ${MAX_LIMIT}`);
	}

	return {
		page: parsedPage,
		limit: parsedLimit,
		skip: (parsedPage - 1) * parsedLimit,
		take: parsedLimit,
	};
};

export const paginationResponse = ({ data, total, page, limit }) => ({
	data,
	total,
	page,
	limit,
});
