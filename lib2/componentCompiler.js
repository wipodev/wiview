import path from "path";
import componentProcessor from "./processComponent.js";

export function compileComponent(sourceCode, filePath) {
  const componentName = path.basename(filePath, ".html").replace(/[-_]/g, "");
  const component = componentProcessor(sourceCode, componentName);

  const props = Object.entries(component.scriptContent.props)
    .map(([key, value]) => {
      const valueExpression = value ? value : `""`;
      return `${key}: ${valueExpression}`;
    })
    .join(", ");
  const state = Object.entries(component.scriptContent.state)
    .map(([key, value]) => {
      const valueExpression = value ? value : `""`;
      return `this.defineReactiveProperty(this.state, "${key}", ${valueExpression});`;
    })
    .join("\n");
  const subscriptions = Object.entries(component.scriptContent.state)
    .map(([key]) => `this.subscriptions.${key}.push(() => this.render());`)
    .join("\n");
  const bindMethods = Object.entries(component.scriptContent.methods)
    .map(([key]) => `this.${key} = this.${key}.bind(this);`)
    .join("\n");
  const methods = Object.entries(component.scriptContent.methods)
    .map(([_, value]) => `${value};`)
    .join("\n");

  const styleContent = component.styleContent.styles
    ? `ensureStyles() {
    if (!document.querySelector(\`style[data-style-for="${componentName}"]\`)) {
      const style = document.createElement("style");
      style.setAttribute("data-style-for", "${componentName}");
      style.textContent = \`${component.styleContent.styles}\`;
      document.head.appendChild(style);
    }
  }`
    : "";

  return `${component.scriptContent.imports}
class ${componentName} {
  constructor(props = {}) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.props = { ${props}, ...props};
    this.subscriptions = {};
    this.state = {};
    ${state}
    ${subscriptions}
    ${bindMethods}
    this.ensureStyles();
  }

  defineReactiveProperty(obj, key, initialValue) {
    let value = initialValue;
    this.subscriptions[key] = [];
    Object.defineProperty(obj, key, {
      get: () => value,
      set: (newValue) => {
        value = newValue;
        this.subscriptions[key].forEach((callback) => callback());
      },
    });
  }

  ${styleContent}

  ${methods}

  updateComponent(currentRender, newRender) {
    if (!currentRender || !newRender) return;

    const currentChildren = Array.from(currentRender.childNodes);
    const newChildren = Array.from(newRender.childNodes);

    newChildren.forEach((newChild, index) => {
      if (!newChild.hasAttribute("data-component-id")) {
        const currentChild = currentChildren[index];

        if (currentChild && currentChild.isEqualNode(newChild)) {
          return;
        }

        const existingNode = currentChildren.find((child) => child.isEqualNode(newChild));
        if (existingNode) {
          currentRender.insertBefore(existingNode, currentChild || null);
        } else {
          currentRender.insertBefore(newChild.cloneNode(true), currentChild || null);
        }
      }
    });

    currentChildren.forEach((currentChild) => {
      if (!currentChild.hasAttribute("data-component-id")) {
        if (!newChildren.some((newChild) => newChild.isEqualNode(currentChild))) {
          currentRender.removeChild(currentChild);
        }
      }
    });
  }

  render(container = null) {
    ${component.templateContent}

    if (container) {
      container.appendChild(${component.container});
    } else {
      const el = document.querySelector(\`[data-component-id="${componentName}-\${this.id}"]\`);
      this.updateComponent(el, ${component.container});
    }

    return ${component.container};
  }

  mount(container) {
    this.render(container);
  }
}

export default ${componentName};`;
}
