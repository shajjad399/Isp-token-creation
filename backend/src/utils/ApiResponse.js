// backend/src/utils/ApiResponse.js
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = 'Success', statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static error(message, statusCode = 500, data = null) {
    return new ApiResponse(statusCode, data, message);
  }
}

export default ApiResponse;