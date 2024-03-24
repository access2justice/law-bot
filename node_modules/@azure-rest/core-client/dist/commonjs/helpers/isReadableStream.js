"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReadableStream = void 0;
/**
 * Checks if the body is a ReadableStream supported by Node
 * @internal
 */
function isReadableStream(body) {
    return Boolean(body) && typeof body.pipe === "function";
}
exports.isReadableStream = isReadableStream;
//# sourceMappingURL=isReadableStream.js.map