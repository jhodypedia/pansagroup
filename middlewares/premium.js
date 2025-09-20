export function requirePremium(req,res,next){
  if(req.session?.user?.isPremium) return next();
  return res.status(403).json({ success:false, message:"Butuh Premium" });
}
