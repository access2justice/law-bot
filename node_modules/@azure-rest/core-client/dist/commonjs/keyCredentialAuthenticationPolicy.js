"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyCredentialAuthenticationPolicy = exports.keyCredentialAuthenticationPolicyName = void 0;
/**
 * The programmatic identifier of the bearerTokenAuthenticationPolicy.
 */
exports.keyCredentialAuthenticationPolicyName = "keyCredentialAuthenticationPolicy";
function keyCredentialAuthenticationPolicy(credential, apiKeyHeaderName) {
    return {
        name: exports.keyCredentialAuthenticationPolicyName,
        async sendRequest(request, next) {
            request.headers.set(apiKeyHeaderName, credential.key);
            return next(request);
        },
    };
}
exports.keyCredentialAuthenticationPolicy = keyCredentialAuthenticationPolicy;
//# sourceMappingURL=keyCredentialAuthenticationPolicy.js.map