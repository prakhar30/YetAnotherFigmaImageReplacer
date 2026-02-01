/// <reference types="vite/client" />

// Extend InputHTMLAttributes to include webkitdirectory
declare namespace React {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
