import React, { MouseEvent } from 'react'

interface ButtonProps {
    children?: React.ReactNode;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    disabled: boolean
}

const Button = ({ children, onClick, className, disabled }: ButtonProps) => {
    return (
        <button className={`${className}`} onClick={onClick} type='submit' disabled={disabled}>
            {children}
        </button>
    )
}

export default Button