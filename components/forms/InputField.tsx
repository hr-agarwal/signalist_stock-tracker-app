import React from 'react'
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";

// This is a reusable text input block with a label and error message.
const InputField = ({ name,label,placeholder,type= "text", register,error,validation,disabled,value} : FormInputProps) => {
    return (
        <div className="space-y-2 ">
            <label htmlFor={name} className="form-label">
                {label}
            </label>
            <Input
                type ={type}
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                value={value}
                className={cn('form-input', {'opacity-50 cursor-not-allowed':disabled})}
                {...register(name,validation)}
            />

            {error && <p className="text-sm text-red-500 ">{error.message}</p>}
        </div>
    )
}
export default InputField
