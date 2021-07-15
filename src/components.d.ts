/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { Routes } from "./components/identifo-form/identifo-form";
import { ApiError, LoginResponse } from "@identifo/identifo-auth-js";
export namespace Components {
    interface IdentifoForm {
        "appId": string;
        "route": Routes;
        "theme": 'dark' | 'light';
        "token": string;
        "url": string;
    }
}
declare global {
    interface HTMLIdentifoFormElement extends Components.IdentifoForm, HTMLStencilElement {
    }
    var HTMLIdentifoFormElement: {
        prototype: HTMLIdentifoFormElement;
        new (): HTMLIdentifoFormElement;
    };
    interface HTMLElementTagNameMap {
        "identifo-form": HTMLIdentifoFormElement;
    }
}
declare namespace LocalJSX {
    interface IdentifoForm {
        "appId"?: string;
        "onComplete"?: (event: CustomEvent<LoginResponse>) => void;
        "onError"?: (event: CustomEvent<ApiError>) => void;
        "route"?: Routes;
        "theme"?: 'dark' | 'light';
        "token"?: string;
        "url"?: string;
    }
    interface IntrinsicElements {
        "identifo-form": IdentifoForm;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "identifo-form": LocalJSX.IdentifoForm & JSXBase.HTMLAttributes<HTMLIdentifoFormElement>;
        }
    }
}
