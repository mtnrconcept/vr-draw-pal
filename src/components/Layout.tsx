import React from "react";
import { GlobalMenu } from "./GlobalMenu";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <>
            <GlobalMenu />
            {children}
        </>
    );
};
