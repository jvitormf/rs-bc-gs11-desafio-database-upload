import { getCustomRepository, getRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepostory = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepostory.getBalance();

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError(`Transaction type ${type} isn't allowed!`);
    }

    if (type === 'outcome' && value > total) {
      throw new AppError(`You don't have enough balance`);
    }

    const categoryRepository = getRepository(Category);

    let categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryExists) {
      categoryExists = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(categoryExists);
    }

    const transaction = transactionsRepostory.create({
      title,
      value,
      type,
      category_id: categoryExists.id,
    });

    await transactionsRepostory.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
