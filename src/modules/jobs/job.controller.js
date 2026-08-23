import { sendSuccessResponse } from "../../utils/response.util.js";
import * as jobService from "./job.service.js";

export const getStatus = async (req, res) => sendSuccessResponse(res, {
    data: await jobService.getStatus(req.params.id, req.auth.organizationId),
});
