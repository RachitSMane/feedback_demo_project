import express from 'express';
import { 
  getQueries, 
  createQuery, 
  solveQuery, 
  approveQuery, 
  deleteQuery 
} from '../controllers/queryController.js';

const router = express.Router();

router.route('/')
  .get(getQueries)
  .post(createQuery);

router.route('/:id/solve')
  .post(solveQuery);

router.route('/:id/approve')
  .put(approveQuery);

router.route('/:id')
  .delete(deleteQuery);

export default router;
