// Mock Google Apps Script `google.script.run`
// This allows the original frontend code to interact with our Express backend using the same syntax.
// Refactored to handle concurrency by creating a new runner instance for each chain.

const google = {
    script: {
        get run() {
            return new GoogleScriptRunner();
        }
    }
};

class GoogleScriptRunner {
    constructor() {
        this.successCallback = null;
        this.failureCallback = null;
    }

    withSuccessHandler(successCallback) {
        this.successCallback = successCallback;
        return this;
    }

    withFailureHandler(failureCallback) {
        this.failureCallback = failureCallback;
        return this;
    }

    // API Calls Mappings

    // 1. Authentication
    loginUser(credentials) {
        this._callApi('/api/users/login', 'POST', credentials);
    }

    logoutUser(token) {
         if(this.successCallback) this.successCallback({ success: true, message: "Logged out" });
    }

    getUserDetailsFromToken(token) {
         this._callApi('/api/users/profile', 'GET', null, token);
    }

    // 2. User Management
    updateUserDisplayName(token, newDisplayName) {
        this._callApi('/api/users/profile', 'PUT', { displayName: newDisplayName }, token);
    }

    changePassword(token, oldPassword, newPassword) {
        this._callApi('/api/users/password', 'PUT', { oldPassword, newPassword }, token);
    }

    getAllUsers(token) {
        this._callApi('/api/users', 'GET', null, token);
    }

    adminCreateUser(token, newUser) {
        this._callApi('/api/users', 'POST', newUser, token);
    }

    adminUpdateUser(token, userData) {
        this._callApi(`/api/users/${userData.email}`, 'PUT', userData, token);
    }

    // 3. DO Management
    getAllDOs(token, filters) {
        this._callApi('/api/dos', 'GET', filters, token);
    }

    getPendingDOs(token, filters) {
        this._callApi('/api/dos/pending', 'GET', filters, token);
    }

    getDispatcherAcknowledgedDOs(token, filters) {
        this._callApi('/api/dos/acknowledged', 'GET', filters, token);
    }

    getDOTaskDetails(token, taskId) {
        this._callApi(`/api/dos/${taskId}`, 'GET', null, token);
    }

    submitNewDO(token, formData) {
        this._callApi('/api/dos', 'POST', formData, token);
    }

    updateTaskRemarks(token, taskId, remarks) {
        this._callApi(`/api/dos/${taskId}/remarks`, 'PUT', { remarks }, token);
    }

    handleDispatcherAction(token, payload) {
        this._callApi('/api/dos/action', 'POST', payload, token);
    }

    // 4. Utils & Notifications
    getBranchList() {
        this._callApi('/api/utils/branches', 'GET');
    }

    getNotificationsForUser(token) {
        this._callApi('/api/notifications', 'GET', null, token);
    }

    markNotificationsAsRead(token) {
        this._callApi('/api/notifications/read', 'PUT', null, token);
    }


    // Internal Helper to make fetch calls
    _callApi(url, method, body, token) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Handle query params for GET requests
        if (method === 'GET' && body) {
            // Filter out null/undefined/empty strings to keep URL clean
            const params = new URLSearchParams();
            for (const key in body) {
                if (body[key] !== null && body[key] !== undefined && body[key] !== '') {
                    params.append(key, body[key]);
                }
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
        }

        const options = {
            method: method,
            headers: headers
        };

        if (method !== 'GET' && body) {
            options.body = JSON.stringify(body);
        }

        fetch(url, options)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                     if (this.failureCallback) {
                        this.failureCallback({ message: data.error });
                    } else if (this.successCallback) {
                        this.successCallback({ success: false, message: data.error });
                    }
                } else {
                    if (this.successCallback) {
                        // Normalize response if backend sends raw data vs wrapper
                        if (data.success === undefined) {
                             this.successCallback({ success: true, data: data });
                        } else {
                             this.successCallback(data);
                        }
                    }
                }
            })
            .catch(error => {
                if (this.failureCallback) {
                    this.failureCallback(error);
                } else {
                    console.error("API Call Failed", error);
                }
            });
    }
}

// Mock ScriptApp.getService().getUrl()
const ScriptApp = {
    getService: function() {
        return {
            getUrl: function() {
                return '/';
            }
        }
    }
};
