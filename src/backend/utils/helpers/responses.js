const Prometheus = require('prom-client');

const serverResponse = {
    sendSuccess: (req, res, message, data = null) => {
        const request_counter = Prometheus.register.getSingleMetric("http_request_count");
        const http_request_duration_milliseconds = Prometheus.register.getSingleMetric("http_request_duration_milliseconds");

        const responseMessage = {
            code: message.code ? message.code : 500,
            success: message.success,
            message: message.message,
        };
        if (data) { responseMessage.data = data; }

        request_counter.labels({ method: req.method, route: req.originalUrl, statusCode: responseMessage.code }).inc();

        const responseTimeInMilliseconds = Date.now() - res.locals.startEpoch;
        http_request_duration_milliseconds
            .labels(req.method, req.route.path, res.statusCode)
            .observe(responseTimeInMilliseconds);
        
        return res.status(message.code).json(responseMessage);
    },
    sendError: (req, res, error) => {
        const request_counter = Prometheus.register.getSingleMetric("http_request_count");
        const http_request_duration_milliseconds = Prometheus.register.getSingleMetric("http_request_duration_milliseconds");

        const responseMessage = {
            code: error.code ? error.code : 500,
            success: false,
            message: error.message,
        };
        request_counter.labels({ method: req.method, route: req.originalUrl, statusCode: responseMessage.code }).inc();

        const responseTimeInMilliseconds = Date.now() - res.locals.startEpoch;
        http_request_duration_milliseconds
            .labels(req.method, req.route.path, res.statusCode)
            .observe(responseTimeInMilliseconds);
        
        return res.status(error.code ? error.code : 500).json(responseMessage);
    },
};

module.exports = serverResponse;