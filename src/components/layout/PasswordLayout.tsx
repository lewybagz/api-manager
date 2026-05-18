import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LayoutShell from "../pw/LayoutShell";
import { useSecretCode } from "../../utils/useSecretCode";

const PasswordLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleSecret = useCallback(() => {
    navigate("/pw/uh-oh");
  }, [navigate]);

  useSecretCode("giggles", handleSecret, {
    resetMs: 3000,
    ignoreWhenEditing: true,
  });

  return <LayoutShell />;
};

export default PasswordLayout;
