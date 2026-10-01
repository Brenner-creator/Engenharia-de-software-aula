export class ProdutoController {
  private produtoService: ProdutoService;

  constructor() {
    this.produtoService = new ProdutoService();
  }

public createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const productData = req.body;
      const product = await this.produtoService.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
}