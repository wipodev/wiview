import { createElement } from "./elementCreator.js";

const directives = {
  "data-if": processDirectiveIf,
  "data-for": processDirectiveFor,
  on: processDirectiveOn,
};

export function processDirectives(config) {
  if (Object.keys(config.attributes).length === 0) {
    return resolveChildCreation(config);
  }

  let attributeCode = "";

  Object.entries(config.attributes).forEach(([attr, value]) => {
    const directiveKey = Object.keys(directives).find((key) => attr.startsWith(key));
    if (directiveKey) {
      attributeCode += directives[directiveKey]({ ...config, value, attr });
    } else if (
      !attributes["data-if"] &&
      !attributes["data-for"] &&
      !attributeCode &&
      !Object.keys(attributes).some((key) => key.startsWith("on"))
    ) {
      attributeCode += resolveChildCreation(config);
    }
  });

  return attributeCode;
}

function processDirectiveIf(config) {
  const resolvedValue = config.value.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (match) =>
    config.resolveReactiveKey(match)
  );
  let ifCode = `if (${resolvedValue}) {\n`;
  ifCode += resolveChildCreation({ ...config, directive: "data-if" });
  ifCode += `}\n`;
  return ifCode;
}

function processDirectiveOn(config) {
  const assignOn = `${config.tagName}${config.index}.${config.attr} = this.${config.value.replace(/\(\s*\)$/, "")};\n`;
  return resolveChildCreation({ ...config, assignOn, directive: "on" });
}

function processDirectiveFor(config) {
  const [item, array] = config.value.split(" in ").map((str) => str.trim());
  let forCode = `${config.resolveReactiveKey(array)}.forEach((${item}, id) => {\n`;
  forCode += resolveChildCreation({ ...config, item, directive: "data-for" });
  forCode += "});\n";
  return forCode;
}

function createComponentChild(config) {
  const props = getProps(config);
  const id = config.directive === "data-for" ? "`${id}`" : "";
  let childCode = `  const ${config.tagName}${config.index}${id} = new ${config.componentChild}({${props}});\n`;
  childCode += `  ${config.tagName}${config.index}${id}.mount(${config.container});\n`;

  return childCode;
}

function getProps({ attributes, item, directive, resolveReactiveKey }) {
  return Object.entries(attributes || {})
    .map(([key, val]) => {
      if (key === directive) return null;
      const resolvedValue = val.replace(/{(.*?)}/g, (_, key) =>
        key.trim() === item ? item : resolveReactiveKey(key.trim())
      );
      return `${key}: ${resolvedValue}`;
    })
    .filter(Boolean)
    .join(", ");
}

function resolveChildCreation(config) {
  const componentChild = config.getName(config.tagName);

  if (!componentChild) {
    return createElement(config);
  } else {
    return createComponentChild(config);
  }
}