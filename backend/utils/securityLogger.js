const securityLog = (event, metadata = {}) => {
  const safeMetadata = { ...metadata };
  delete safeMetadata.password;
  delete safeMetadata.token;
  delete safeMetadata.resetToken;
  delete safeMetadata.resetLink;
  console.info(JSON.stringify({
    type: "security_audit",
    event,
    at: new Date().toISOString(),
    ...safeMetadata,
  }));
};

module.exports = securityLog;
