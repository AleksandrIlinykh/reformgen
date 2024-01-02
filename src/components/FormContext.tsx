import React, { createContext, FC, useContext, useMemo } from "react";
import { FieldValues, useForm } from "react-hook-form";

import { FormContextProps, JSONFormContextValues } from "./types";
import {
  getIdSchemaPairs,
  getObjectFromForm,
  resolveRefs
} from "../JSONSchema/logic";

export const InternalFormContext = createContext<JSONFormContextValues | null>(
  null
);

export function useFormContext<
  T extends FieldValues = FieldValues
>(): JSONFormContextValues<T> {
  return useContext(InternalFormContext) as JSONFormContextValues<T>;
}

export const FormContext: FC<FormContextProps> = props => {
  const {
    children,
    schema,
    formProps: userFormProps,
    onChange,
    onSubmit,
    validationMode = "onSubmit",
    revalidateMode = "onChange",
    customValidators,
    noNativeValidate,
    submitFocusError = true,
    defaultValues
  } = props;

  const methods = useForm({
    defaultValues,
    mode: validationMode,
    reValidateMode: revalidateMode,
    submitFocusError: submitFocusError
  });

  const isFirstRender = React.useRef(true);

  if (typeof onChange === "function") {
    const watchedInputs = methods.watch();

    if (isFirstRender.current === false) {
      onChange(getObjectFromForm(schema, watchedInputs));
    }
  }

  const idMap = useMemo(() => getIdSchemaPairs(schema), [schema]);

  const resolvedSchemaRefs = useMemo(() => resolveRefs(schema, idMap, []), [
    schema,
    idMap
  ]);

  const formContext: JSONFormContextValues = useMemo(() => {
    return {
      ...methods,
      schema: resolvedSchemaRefs,
      idMap: idMap,
      customValidators: customValidators
    };
  }, [methods, resolvedSchemaRefs, idMap, customValidators]);

  const formProps: React.ComponentProps<"form"> = { ...userFormProps };

  formProps.onSubmit = methods.handleSubmit(async (data, event) => {
    if (onSubmit) {
      return onSubmit({
        data: getObjectFromForm(schema, data),
        event: event,
        methods: formContext
      });
    }
    return;
  });

  if (noNativeValidate) {
    formProps.noValidate = noNativeValidate;
  }

  if (isFirstRender.current === true) {
    isFirstRender.current = false;
  }

  return (
    <InternalFormContext.Provider value={formContext}>
      <form {...formProps}>{children}</form>
    </InternalFormContext.Provider>
  );
};
