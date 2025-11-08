"use client";
import "@aws-amplify/ui-react/styles.css";
import { ThemeProvider, Authenticator, translations } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";
import outputs from "../../amplify_outputs.json";

// Configure Amplify immediately
Amplify.configure(outputs, { ssr: true });

// Configure I18n for Japanese
I18n.putVocabularies(translations);
I18n.setLanguage("ja");

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Authenticator.Provider>{children}</Authenticator.Provider>
    </ThemeProvider>
  );
}
