
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <Card className="w-full max-w-md mx-4 glass-card slide-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to MyCrypto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => navigate("/login")} 
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            Login
          </Button>
          <Button 
            onClick={() => navigate("/register")} 
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-white"
          >
            Register
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
