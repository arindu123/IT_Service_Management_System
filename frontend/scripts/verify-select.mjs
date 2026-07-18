import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
try {
  const { Select } = await vite.ssrLoadModule("/src/design-system/Form.jsx");
  const options = [{ value: "admin", label: "Admin" }, { value: "user", label: "User" }];
  const selected = renderToStaticMarkup(React.createElement(Select, { label: "Role", options, value: "admin", onChange() {} }));
  assert.match(selected, />Admin<\/option>/, "renders object options");
  assert.match(selected, /value="admin" selected=""/, "preserves selected value");
  const states = renderToStaticMarkup(React.createElement(Select, { label: "Role", options: [], disabled: true, required: true, error: "Required" }));
  assert.match(states, /disabled=""/, "supports disabled state");
  assert.match(states, /required=""/, "supports required state");
  assert.match(states, /aria-invalid="true"/, "supports accessible error state");
  assert.doesNotMatch(states, /<option/, "supports empty options");
  const children = renderToStaticMarkup(React.createElement(Select, { label: "Role" }, React.createElement("option", { value: "admin" }, "Admin")));
  assert.match(children, />Admin<\/option>/, "preserves children API");
  console.log("Select component verification passed");
} finally {
  await vite.close();
}
