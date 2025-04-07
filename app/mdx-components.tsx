import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold text-white mt-6 mb-2">{children}</h2>,
    p: ({ children }) => <p className="text-white mb-4">{children}</p>,
    strong: ({ children }) => <strong className="text-white font-medium">{children}</strong>,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 text-[#A0A0A0]">{children}</ul>,
    li: ({ children }) => <li className="text-sm">{children}</li>,
    Hint: ({ children }) => (
      <div className="bg-black text-yellow-800 p-2 rounded mb-4 border border-yellow-300">
        <strong>Hint:</strong> {children}
      </div>
    ),
    pre: ({ children }) => {
      const child = Array.isArray(children) ? children[0] : children;
      if (child && typeof child === 'object' && 'props' in child) {
        const { className, children } = child.props;
        const matches = className ? className.match(/language-(\w+)/) : null;
        const language = matches ? matches[1] : 'text';
        return (
          <pre className={`language-${language} bg-[#1a1a1a] p-4 rounded overflow-x-auto`}>
            <code className={`language-${language}`}>{children}</code>
          </pre>
        );
      }
      return <pre>{children}</pre>;
    },
    CodeBlock: ({ language, children }) => (
      <pre className={`language-${language} bg-[#1a1a1a] p-4 rounded overflow-x-auto`}>
        <code className={`language-${language}`}>{children}</code>
      </pre>
    ),
    ...components, // Merge with provided components
  };
}