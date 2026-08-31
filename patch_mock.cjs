const fs = require('fs');
let code = fs.readFileSync('src/components/MockProctorWidget.tsx', 'utf8');

const target = `    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true
        });
        streamRef.current = stream;
        setHasCameraPermission(true);
      } else {
        setHasCameraPermission(false);
      }
    } catch (err) {
      console.warn("Camera/Mic permission denied or unavailable:", err);
      setHasCameraPermission(false);
    }`;

const replacement = `    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true
        });
        streamRef.current = stream;
        setHasCameraPermission(true);
      } else {
        setHasCameraPermission(false);
        setWarningMessage("الكاميرا غير مدعومة في هذا المتصفح.");
      }
    } catch (err: any) {
      console.warn("Camera/Mic permission denied or unavailable:", err);
      setHasCameraPermission(false);
      
      let errorMessage = "حدث خطأ أثناء الوصول للكاميرا.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "تم رفض صلاحية الوصول للكاميرا والمايكروفون. يرجى تفعيلها من إعدادات المتصفح.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "لم يتم العثور على كاميرا أو مايكروفون.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "الكاميرا مستخدمة حالياً بواسطة تطبيق آخر.";
      }
      setWarningMessage(errorMessage);
    }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/MockProctorWidget.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
